package com.kh.trip.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kh.trip.domain.enums.MemberGradeName;
import com.kh.trip.dto.MemberGradeDTO;
import com.kh.trip.service.MemberGradeService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/membergrade")
public class MemberGradeController {

	private final MemberGradeService service;

	@PostMapping
	public Map<String, MemberGradeName> save(@RequestBody MemberGradeDTO memberGradeDTO) {
		log.info("MemberGradeDTO = " + memberGradeDTO);
		MemberGradeName gradeName = service.save(memberGradeDTO);
		return Map.of("result", gradeName);
	}

	@GetMapping("/list")
	public List<MemberGradeDTO> findAll() {
		log.info("MemberGradeFindAll()");
		return service.findAll();
	}

	@GetMapping("/{gradeName}")
	public MemberGradeDTO findById(@PathVariable MemberGradeName gradeName) {
		log.info("MemberGradeFindById()" + gradeName);
		return service.findById(gradeName);
	}

	@DeleteMapping("/{gradeName}")
	public Map<String, String> delete(@PathVariable MemberGradeName gradeName) {
		log.info("MemberGradeDelete" + gradeName);
		service.delete(gradeName);
		return Map.of("result", "SUCCESS");
	}

	@PatchMapping("/{gradeName}")
	public Map<String, String> update(@PathVariable MemberGradeName gradeName,
			@RequestBody MemberGradeDTO memberGradeDTO) {
		memberGradeDTO.setGradeName(gradeName);
		log.info("MemberGradeUpdate" + gradeName);
		service.update(memberGradeDTO);
		return Map.of("result", "SUCCESS");
	}
}
